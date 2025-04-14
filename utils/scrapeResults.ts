import axios from 'axios';
import { load } from 'cheerio';

const BASE_URL = 'https://www.osmania.ac.in/res07/20250403.jsp';

export const fetchResult = async (hallTicketNo: string) => {
  try {
    console.log(`Fetching result for hall ticket: ${hallTicketNo}`);
    
    // Create form data with the hall ticket number
    const formData = new URLSearchParams();
    formData.append('htno', hallTicketNo);
    
    // Submit the form
    const response = await axios.post(BASE_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // Log the response for debugging
    console.log('Response received, length:', response.data.length);
    
    // Parse the response HTML
    const $ = load(response.data);
    
    // Check if the response contains an error message
    if (response.data.includes('Invalid') || response.data.includes('No Records Found')) {
      return {
        error: 'Invalid hall ticket number or no results found'
      };
    }

    // Extract personal details using a more direct approach
    const personalDetails = {
      name: '',
      fatherName: '',
      gender: '',
      course: '',
      medium: '',
    };

    // Find all tables in the document
    const tables = $('table');
    console.log(`Found ${tables.length} tables on the page`);

    // Process each table to find personal details
    tables.each((i, table) => {
      const tableHtml = $(table).html() || '';
      
      // Look for tables with personal details
      $(table).find('tr').each((_, row) => {
        const rowHtml = $(row).html() || '';
        const rowText = $(row).text();
        
        // Extract name
        if (rowText.includes('Name') && !rowText.includes("Father's Name")) {
          const cells = $(row).find('td');
          cells.each((idx, cell) => {
            if ($(cell).text().includes('Name')) {
              if (idx + 1 < cells.length) {
                personalDetails.name = $(cells[idx + 1]).text().trim();
                console.log('Found name:', personalDetails.name);
              }
            }
          });
        }
        
        // Extract father's name
        if (rowText.includes("Father's Name")) {
          const cells = $(row).find('td');
          cells.each((idx, cell) => {
            if ($(cell).text().includes("Father's Name")) {
              if (idx + 1 < cells.length) {
                personalDetails.fatherName = $(cells[idx + 1]).text().trim();
                console.log('Found father name:', personalDetails.fatherName);
              }
            }
          });
        }
        
        // Extract gender
        if (rowText.includes('Gender')) {
          const cells = $(row).find('td');
          cells.each((idx, cell) => {
            if ($(cell).text().includes('Gender')) {
              if (idx + 1 < cells.length) {
                personalDetails.gender = $(cells[idx + 1]).text().trim();
                console.log('Found gender:', personalDetails.gender);
              }
            }
          });
        }
        
        // Extract course
        if (rowText.includes('Course')) {
          const cells = $(row).find('td');
          cells.each((idx, cell) => {
            if ($(cell).text().includes('Course')) {
              if (idx + 1 < cells.length) {
                personalDetails.course = $(cells[idx + 1]).text().trim();
                console.log('Found course:', personalDetails.course);
              }
            }
          });
        }
        
        // Extract medium
        if (rowText.includes('Medium')) {
          const cells = $(row).find('td');
          cells.each((idx, cell) => {
            if ($(cell).text().includes('Medium')) {
              if (idx + 1 < cells.length) {
                personalDetails.medium = $(cells[idx + 1]).text().trim();
                console.log('Found medium:', personalDetails.medium);
              }
            }
          });
        }
      });
    });

    // If we couldn't extract data properly, try a more direct approach with regex
    if (!personalDetails.name) {
      console.log('Trying regex approach for personal details');
      const htmlContent = response.data;
      
      // Extract name using regex
      const nameMatch = htmlContent.match(/Name<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
      if (nameMatch && nameMatch[1]) {
        personalDetails.name = nameMatch[1].trim();
        console.log('Found name via regex:', personalDetails.name);
      }
      
      // Extract father's name using regex
      const fatherMatch = htmlContent.match(/Father's Name<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
      if (fatherMatch && fatherMatch[1]) {
        personalDetails.fatherName = fatherMatch[1].trim();
        console.log('Found father name via regex:', personalDetails.fatherName);
      }
      
      // Extract gender using regex
      const genderMatch = htmlContent.match(/Gender<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
      if (genderMatch && genderMatch[1]) {
        personalDetails.gender = genderMatch[1].trim();
        console.log('Found gender via regex:', personalDetails.gender);
      }
      
      // Extract course using regex
      const courseMatch = htmlContent.match(/Course<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
      if (courseMatch && courseMatch[1]) {
        personalDetails.course = courseMatch[1].trim();
        console.log('Found course via regex:', personalDetails.course);
      }
      
      // Extract medium using regex
      const mediumMatch = htmlContent.match(/Medium<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
      if (mediumMatch && mediumMatch[1]) {
        personalDetails.medium = mediumMatch[1].trim();
        console.log('Found medium via regex:', personalDetails.medium);
      }
    }

    // Extract marks details
    const marksDetails = [];
    
    // Find the table with subject details
    tables.each((i, table) => {
      const headerRow = $(table).find('tr:first-child').text();
      if (headerRow.includes('Sub Code') || headerRow.includes('Subject Code')) {
        console.log(`Found marks table at index ${i}`);
        
        // Process each data row
        $(table).find('tr:not(:first-child)').each((_, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 5) {
            const subject = {
              subjectCode: $(cells[0]).text().trim(),
              subjectName: $(cells[1]).text().trim(),
              credits: $(cells[2]).text().trim(),
              gradePoints: $(cells[3]).text().trim(),
              grade: $(cells[4]).text().trim(),
            };
            
            // Only add if we have a subject code
            if (subject.subjectCode) {
              marksDetails.push(subject);
              console.log(`Found subject: ${subject.subjectCode} - ${subject.subjectName}`);
            }
          }
        });
      }
    });

    // If we couldn't extract subjects, try regex
    if (marksDetails.length === 0) {
      console.log('Trying regex approach for subjects');
      const htmlContent = response.data;
      
      // Look for subject patterns in the HTML
      const subjectPattern = /<tr>\s*<td[^>]*>(\d+[A-Z]?)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi;
      let match;
      
      while ((match = subjectPattern.exec(htmlContent)) !== null) {
        const subject = {
          subjectCode: match[1].trim(),
          subjectName: match[2].trim(),
          credits: match[3].trim(),
          gradePoints: match[4].trim(),
          grade: match[5].trim(),
        };
        
        marksDetails.push(subject);
        console.log(`Found subject via regex: ${subject.subjectCode} - ${subject.subjectName}`);
      }
    }

    // Extract result summary
    const resultSummary = {
      semester: '',
      result: '',
      sgpa: '',
      cgpa: '',
    };

    // Find the table with result summary
    tables.each((i, table) => {
      const headerRow = $(table).find('tr:first-child').text();
      if (headerRow.includes('Semester') && headerRow.includes('Result')) {
        console.log(`Found result summary table at index ${i}`);
        
        const dataRow = $(table).find('tr:nth-child(2)');
        const cells = dataRow.find('td');
        
        if (cells.length >= 3) {
          resultSummary.semester = $(cells[0]).text().trim();
          
          // The result and SGPA might be combined like "PASSED-8.38"
          const resultWithSGPA = $(cells[1]).text().trim();
          const resultParts = resultWithSGPA.split('-');
          
          resultSummary.result = resultParts[0] || '';
          resultSummary.sgpa = resultParts[1] || '';
          resultSummary.cgpa = $(cells[2]).text().trim();
          
          console.log(`Found result: ${resultSummary.result}, SGPA: ${resultSummary.sgpa}`);
        }
      }
    });

    // If we couldn't extract result summary, try regex
    if (!resultSummary.result) {
      console.log('Trying regex approach for result summary');
      const htmlContent = response.data;
      
      // Look for result pattern in the HTML
      const resultPattern = /<tr>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/i;
      const match = resultPattern.exec(htmlContent);
      
      if (match) {
        resultSummary.semester = match[1].trim();
        
        const resultWithSGPA = match[2].trim();
        const resultParts = resultWithSGPA.split('-');
        
        resultSummary.result = resultParts[0] || '';
        resultSummary.sgpa = resultParts[1] || '';
        resultSummary.cgpa = match[3].trim();
        
        console.log(`Found result via regex: ${resultSummary.result}, SGPA: ${resultSummary.sgpa}`);
      }
    }

    // As a last resort, try to extract data from the raw HTML
    if (!personalDetails.name && !marksDetails.length && !resultSummary.result) {
      console.log('All extraction methods failed, dumping HTML for manual inspection');
      console.log('HTML sample:', response.data.substring(0, 1000));
      
      // Try to extract any text that looks like a result
      const textContent = $('body').text();
      console.log('Text content sample:', textContent.substring(0, 1000));
      
      // Look for patterns in the text content
      if (textContent.includes('Hall Ticket No')) {
        console.log('Found Hall Ticket No in text content');
        
        // Try to extract name
        const nameMatch = textContent.match(/Name\s+([^\n]+)/);
        if (nameMatch) {
          personalDetails.name = nameMatch[1].trim();
          console.log('Found name in text content:', personalDetails.name);
        }
      }
    }

    return {
      personalDetails,
      marksDetails,
      resultSummary,
    };
    
  } catch (error) {
    console.error('Error fetching result for hall ticket:', hallTicketNo, error);
    return {
      error: 'Failed to fetch result',
      errorDetails: error.message || String(error)
    };
  }
};