const fs = require('fs');
const path = require('path');

function walk(d, a = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, a);
    else if (f.endsWith('.jsx')) a.push(p);
  }
  return a;
}

const files = walk(path.join(__dirname, 'src'));
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const re = /<button[\s\S]*?<\/button>/g;
  let m;
  while ((m = re.exec(t))) {
    const b = m[0];
    if (!/onClick/.test(b) && !/type=["']submit["']/.test(b)) {
      const line = t.slice(0, m.index).split('\n').length;
      console.log(path.relative(__dirname, f) + ':' + line);
      console.log(b.replace(/\s+/g, ' ').slice(0, 220));
      console.log('---');
    }
  }
}
