'use client';

import { useState } from 'react';
import axios from 'axios';

interface ResultProps {
  onResultsFetched?: (results: any[]) => void;
}

export default function FetchData({ onResultsFetched }: ResultProps) {
  const [hallTickets, setHallTickets] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [rawHtml, setRawHtml] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo('Starting fetch process...');
    setResults([]);
    setRawHtml('');

    try {
      // Split and trim hall ticket numbers
      const hallTicketNos = hallTickets
        .split('\n')
        .map(ticket => ticket.trim())
        .filter(ticket => ticket.length > 0);
      
      setDebugInfo(prev => `${prev}\nProcessing ${hallTicketNos.length} hall tickets: ${hallTicketNos.join(', ')}`);

      // First, try to fetch the raw HTML directly to see what we're working with
      try {
        const formData = new URLSearchParams();
        formData.append('htno', hallTicketNos[0]);
        
        const directResponse = await axios.post('https://www.osmania.ac.in/res07/20250403.jsp', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        setRawHtml(directResponse.data);
        setDebugInfo(prev => `${prev}\nFetched raw HTML directly from source (${directResponse.data.length} bytes)`);
      } catch (directError) {
        setDebugInfo(prev => `${prev}\nFailed to fetch raw HTML: ${directError.message}`);
      }

      // Call our API route
      const response = await axios.post('/api/scrapeResults', { hallTicketNos });
      
      console.log('Received response:', response.data);
      setDebugInfo(prev => `${prev}\nReceived response from API`);
      
      setResults(response.data);
      
      // Handle the results
      if (onResultsFetched) {
        onResultsFetched(response.data);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(`Failed to fetch results: ${err.message || 'Unknown error'}`);
      setDebugInfo(prev => `${prev}\nError: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Fetch Results</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="hallTickets" className="block text-sm font-medium mb-1">
            Hall Ticket Numbers (one per line)
          </label>
          <textarea
            id="hallTickets"
            rows={5}
            className="w-full p-2 border rounded-md"
            value={hallTickets}
            onChange={(e) => setHallTickets(e.target.value)}
            placeholder="Enter hall ticket numbers, one per line"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Fetching...' : 'Fetch Results'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {debugInfo && (
        <div className="mt-4 p-3 bg-gray-100 text-gray-700 rounded-md">
          <h3 className="font-medium">Debug Info:</h3>
          <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Results:</h3>
          <div className="border rounded-md overflow-hidden">
            {results.map((item, index) => (
              <div key={index} className="p-4 border-b last:border-b-0">
                <h4 className="font-semibold">Hall Ticket: {item.hallTicketNo}</h4>
                
                {item.result?.error ? (
                  <p className="text-red-600 mt-2">{item.result.error}</p>
                ) : (
                  <div className="mt-2">
                    <p><strong>Name:</strong> {item.result?.personalDetails?.name || 'Not found'}</p>
                    <p><strong>Father's Name:</strong> {item.result?.personalDetails?.fatherName || 'Not found'}</p>
                    <p><strong>Gender:</strong> {item.result?.personalDetails?.gender || 'Not found'}</p>
                    <p><strong>Course:</strong> {item.result?.personalDetails?.course || 'Not found'}</p>
                    <p><strong>Medium:</strong> {item.result?.personalDetails?.medium || 'Not found'}</p>
                    
                    {item.result?.marksDetails?.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium">Subjects:</h5>
                        <table className="w-full mt-2 border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 border">Code</th>
                              <th className="p-2 border">Subject</th>
                              <th className="p-2 border">Credits</th>
                              <th className="p-2 border">Grade Points</th>
                              <th className="p-2 border">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.result.marksDetails.map((subject, idx) => (
                              <tr key={idx}>
                                <td className="p-2 border">{subject.subjectCode}</td>
                                <td className="p-2 border">{subject.subjectName}</td>
                                <td className="p-2 border text-center">{subject.credits}</td>
                                <td className="p-2 border text-center">{subject.gradePoints}</td>
                                <td className="p-2 border text-center">{subject.grade}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {item.result?.resultSummary && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <p><strong>Semester:</strong> {item.result.resultSummary.semester || 'Not found'}</p>
                        <p><strong>Result:</strong> {item.result.resultSummary.result || 'Not found'}</p>
                        <p><strong>SGPA:</strong> {item.result.resultSummary.sgpa || 'Not found'}</p>
                        <p><strong>CGPA:</strong> {item.result.resultSummary.cgpa || 'Not found'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {rawHtml && (
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer font-medium">Raw HTML Response (for debugging)</summary>
            <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap">{rawHtml}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}