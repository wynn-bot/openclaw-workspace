#!/usr/bin/env node
// Simple markdown to .docx converter using officegen
const fs = require('fs');

async function convert(inputPath, outputPath) {
  const officegen = require('officegen');
  const docx = officegen('docx');
  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      const p = docx.createP();
      p.addText(line.replace(/^# /, ''), { bold: true, font_size: 20 });
    } else if (line.startsWith('## ')) {
      const p = docx.createP();
      p.addText(line.replace(/^## /, ''), { bold: true, font_size: 16 });
    } else if (line.startsWith('### ')) {
      const p = docx.createP();
      p.addText(line.replace(/^### /, ''), { bold: true, font_size: 13 });
    } else if (line.startsWith('> ')) {
      const p = docx.createP();
      p.addText(line.replace(/^> /, ''), { italic: true, font_size: 10 });
    } else if (line.startsWith('- ')) {
      const p = docx.createListOfDots();
      p.addText(line.replace(/^- /, ''), { font_size: 10 });
    } else if (line.startsWith('**') && line.endsWith('**')) {
      const p = docx.createP();
      p.addText(line.replace(/\*\*/g, ''), { bold: true, font_size: 10 });
    } else if (line.trim() === '---') {
      const p = docx.createP();
      p.addText('————————————————', { color: 'cccccc', font_size: 8 });
    } else if (line.trim()) {
      const p = docx.createP();
      // Handle inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/);
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          p.addText(part.replace(/\*\*/g, ''), { bold: true, font_size: 10 });
        } else {
          p.addText(part, { font_size: 10 });
        }
      }
    }
  }

  const out = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    out.on('close', resolve);
    out.on('error', reject);
    docx.generate(out);
  });
}

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) { console.error('Usage: md-to-docx.js input.md output.docx'); process.exit(1); }
convert(input, output).then(() => console.log('Done:', output)).catch(e => { console.error(e); process.exit(1); });
