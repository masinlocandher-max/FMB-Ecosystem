// Compatibility entrypoint for the August 8 FMB News AI / Pax Silica series.
// The canonical publisher lives in post-build-fmb-news-ai-francine-august-8.mjs.
// Keep the three slug/title pairs here because the related-story pass reads this
// entrypoint as its stable series manifest.
export const stories = [
  {
    slug:'francine-marie-bautista-ai-photography-creative-skill',
    title:'Using AI Does Not Make You Less of a Photographer: Francine Marie Bautista on Skill, Tools and Creative Judgment'
  },
  {
    slug:'francine-marie-bautista-pax-silica-terms-must-be-clear',
    title:'Francine Marie Bautista on Pax Silica: “Terms Must Be Clear. Questions Must Be Answered.”'
  },
  {
    slug:'francine-marie-bautista-ai-literacy-minimize-risks',
    title:'AI Has Risks. Francine Marie Bautista Says the Answer Is to Learn How to Use It Properly'
  }
];

await import('./post-build-fmb-news-ai-francine-august-8.mjs');
