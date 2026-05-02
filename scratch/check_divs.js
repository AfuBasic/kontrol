
import fs from 'fs';

const content = fs.readFileSync('/Library/WebServer/Documents/projects/kontrol/resources/js/Pages/Admin/Collections/Show.tsx', 'utf-8');

const lines = content.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openings = (line.match(/<div|<motion\.div/g) || []).length;
    const closings = (line.match(/<\/div>|<\/motion\.div>/g) || []).length;
    depth += openings - closings;
    // Also check fragments
    depth += (line.match(/<>/g) || []).length;
    depth -= (line.match(/<\/>/g) || []).length;
}
console.log(`Final depth: ${depth}`);
