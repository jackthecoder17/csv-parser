console.log('Debug script loaded');
window.addEventListener('error', function(e) {
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: system-ui; color: #333;">
      <h2>Error Detected</h2>
      <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${e.message} at ${e.filename}:${e.lineno}:${e.colno}
      </div>
      <h3>Steps to debug:</h3>
      <ol>
        <li>Check browser console for detailed errors</li>
        <li>Verify environment variables are set in Vercel</li>
        <li>Check for missing dependencies</li>
        <li>Review build output in Vercel dashboard</li>
      </ol>
    </div>
  `;
});
