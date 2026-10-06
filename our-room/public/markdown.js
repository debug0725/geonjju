/* Discord-style text formatting. HTML supplied by a user is always escaped. */
(()=>{
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeHref=s=>{try{const u=new URL(s);return ['http:','https:','mailto:'].includes(u.protocol)?u.href:null}catch{return null}};
 const parser=new marked.Marked({gfm:true,breaks:true,renderer:{
  html({text}){return escape(text)},
  link({href,tokens}){const text=this.parser.parseInline(tokens),url=safeHref(href);return url?`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`:text},
  image({href,text}){const url=safeHref(href);return url?`<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(text||href)}</a>`:escape(text)},
  code({text,lang}){return `<pre><code${lang?` data-language="${escape(lang.split(/\s/)[0])}"`:''}>${escape(text)}</code></pre>`}
 }});
 parser.use({extensions:[
 {name:'discordUnderline',level:'inline',start(src){return src.indexOf('__')},tokenizer(src){const m=/^__(?=\S)([\s\S]*?\S)__(?!_)/.exec(src);if(m)return {type:'discordUnderline',raw:m[0],tokens:this.lexer.inlineTokens(m[1])}},renderer(token){return `<u>${this.parser.parseInline(token.tokens)}</u>`}},
 {name:'discordSpoiler',level:'inline',start(src){return src.indexOf('||')},tokenizer(src){const m=/^\|\|([\s\S]+?)\|\|/.exec(src);if(m)return {type:'discordSpoiler',raw:m[0],tokens:this.lexer.inlineTokens(m[1])}},renderer(token){return `<span class="spoiler" tabindex="0" role="button" aria-label="스포일러 보기" aria-expanded="false">${this.parser.parseInline(token.tokens)}</span>`}}
 ]});
 globalThis.renderMarkdown=text=>parser.parse(String(text));
})();
