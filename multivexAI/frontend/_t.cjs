const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const Undef=()=>{ return; };
const Parent=()=>React.createElement('div',null,React.createElement(Undef));
try{ const h=renderToStaticMarkup(React.createElement(Parent)); console.log('NO THROW html=',JSON.stringify(h)); }
catch(e){ console.log('THROW:', e.message.split('\n')[0]); }
console.log('react', require('react/package.json').version);
