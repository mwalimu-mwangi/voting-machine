const markdownpdf = require('markdown-pdf');
const fs = require('fs');

// Read in the markdown file
const docContent = fs.readFileSync('./doc.txt', 'utf8');

// Specify options for the PDF
const options = {
  // cssPath can be used to style the output PDF
  // cssPath: './style.css'
  // paperFormat options: A3, A4, A5, Legal, Letter, Tabloid
  paperFormat: 'A4',
  // Include document title
  remarkable: {
    html: true,
    breaks: true,
    plugins: [],
    syntax: ['footnote', 'sup', 'sub']
  }
};

// Convert markdown to PDF
markdownpdf(options)
  .from.string(docContent)
  .to('./doc.pdf', function () {
    console.log('PDF generated successfully!');
  });