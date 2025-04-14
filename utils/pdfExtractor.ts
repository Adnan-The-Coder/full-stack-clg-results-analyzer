import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import puppeteer from 'puppeteer';
import pdfParse from 'pdf-parse';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

interface Subject {
  subjectCode: string;
  subjectName: string;
  credits: string;
  gradePoints: string;
  gradeSecurity: string;
}

interface ResultData {
  hallTicketNo: string;
  personalDetails: {
    name: string;
    fatherName: string;
    gender: string;
    course: string;
    medium: string;
  };
  marksDetails: Subject[];
  resultSummary: {
    semester: string;
    result: string;
    sgpa: string;
    cgpa: string;
  };
}

export async function fetchResultFromPDF(hallTicketNo: string): Promise<ResultData | { error: string }> {
  const browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
  });
  
  const tempPdfPath = path.join(process.cwd(), 'temp', `${hallTicketNo}.pdf`);
  
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Open a new page
    const page = await browser.newPage();
    
    // Navigate to the results page
    await page.goto('https://www.osmania.ac.in/res07/20250403.jsp', {
      waitUntil: 'networkidle2',
    });
    
    // Enter the hall ticket number
    await page.type('input[name="htno"]', hallTicketNo);
    
    // Submit the form
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Check if results were found
    const pageContent = await page.content();
    if (pageContent.includes('Invalid') || pageContent.includes('No Records Found')) {
      await browser.close();
      
      return {
        error: 'Invalid hall ticket number or no results found'
      };
    }
    
    // Generate PDF
    await page.pdf({
      path: tempPdfPath,
      format: 'A4',
      printBackground: true,
    });
    
    // Close the browser
    await browser.close();
    
    // Read the PDF file
    const pdfBuffer = await readFileAsync(tempPdfPath);
    
    // Parse the PDF content
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;
    
    // Extract data from the PDF text
    const resultData = extractDataFromPDFText(pdfText, hallTicketNo);
    
    // Clean up - delete the temporary PDF file
    await unlinkAsync(tempPdfPath);
    
    return resultData;
  } catch (error) {
    console.error('Error fetching result from PDF:', error);
    
    // Clean up - delete the temporary PDF file if it exists
    if (fs.existsSync(tempPdfPath)) {
      await unlinkAsync(tempPdfPath);
    }
    
    // Make sure to close the browser
    await browser.close();
    
    return {
      error: 'Failed to fetch result: ' + (error.message || String(error))
    };
  }
}

function extractDataFromPDFText(pdfText: string, hallTicketNo: string): ResultData {
  // Initialize the result data structure
  const resultData: ResultData = {
    hallTicketNo,
    personalDetails: {
      name: '',
      fatherName: '',
      gender: '',
      course: '',
      medium: '',
    },
    marksDetails: [],
    resultSummary: {
      semester: '',
      result: '',
      sgpa: '',
      cgpa: '',
    },
  };
  
  // Extract personal details using regex
  const nameMatch = pdfText.match(/Name\s+(.*?)(?=\s+Father's Name|\s+Gender)/s);
  if (nameMatch) resultData.personalDetails.name = nameMatch[1].trim();
  
  const fatherMatch = pdfText.match(/Father's Name\s+(.*?)(?=\s+Gender|\s+Course)/s);
  if (fatherMatch) resultData.personalDetails.fatherName = fatherMatch[1].trim();
  
  const genderMatch = pdfText.match(/Gender\s+(.*?)(?=\s+Course|\s+Medium)/s);
  if (genderMatch) resultData.personalDetails.gender = genderMatch[1].trim();
  
  const courseMatch = pdfText.match(/Course\s+(.*?)(?=\s+Medium|\s+Marks)/s);
  if (courseMatch) resultData.personalDetails.course = courseMatch[1].trim();
  
  const mediumMatch = pdfText.match(/Medium\s+(.*?)(?=\s+Marks|\s+Sub Code)/s);
  if (mediumMatch) resultData.personalDetails.medium = mediumMatch[1].trim();
  
  // Extract marks details
  // This regex looks for patterns like: 175 PROG.FOR PROBLEM SOLVING 3 10 S
  const subjectPattern = /(\d+[A-Z]?)\s+([A-Z\.\s]+)\s+(\d+(?:\.\d+)?)\s+(\d+)\s+([A-Z])/g;
  let subjectMatch;
  
  while ((subjectMatch = subjectPattern.exec(pdfText)) !== null) {
    resultData.marksDetails.push({
      subjectCode: subjectMatch[1].trim(),
      subjectName: subjectMatch[2].trim(),
      credits: subjectMatch[3].trim(),
      gradePoints: subjectMatch[4].trim(),
      gradeSecurity: subjectMatch[5].trim(),
    });
  }
  
  // Extract result summary
  // Look for patterns like: 1 PASSED-8.38 -
  const resultPattern = /(\d+)\s+(PASSED|FAILED)-(\d+\.\d+)\s+(-|\d+\.\d+)/;
  const resultMatch = resultPattern.exec(pdfText);
  
  if (resultMatch) {
    resultData.resultSummary.semester = resultMatch[1].trim();
    resultData.resultSummary.result = resultMatch[2].trim();
    resultData.resultSummary.sgpa = resultMatch[3].trim();
    resultData.resultSummary.cgpa = resultMatch[4].trim();
  }
  
  return resultData;
}