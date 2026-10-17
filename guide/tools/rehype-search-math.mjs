// KaTeX emits both MathML and visual HTML. Indexing both produces duplicated,
// unreadable search excerpts. Keep the accessible equation intact on the page.
// Index inline MathML once; omit visual duplicates, raw TeX and display blocks.
export default function searchMath() {
  return tree => {
    function visit(node) {
      const classes = node.properties?.className || [];
      if (classes.includes('katex-html') || classes.includes('katex-display') || node.tagName === 'annotation') {
        node.properties['data-pagefind-ignore'] = 'all';
        return;
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
