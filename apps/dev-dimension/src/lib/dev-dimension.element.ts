export class DevDimension extends HTMLElement{
    private _text: string | null = 'Default text'; // Default initial text
  
    // (1) Define which attributes to observe for changes.
    static get observedAttributes() {
      return ['data-text']; // We want to react when 'data-text' attribute changes
    }
  
    constructor() {
      super(); // Always call super() first in the constructor.
      // No Shadow DOM for this simple version. We'll manipulate the element's content directly.
      console.log('SimpleTextElement: constructed!');
    }
  
    // (2) Called when the element is added to the document's DOM.
    connectedCallback() {
      console.log('SimpleTextElement: connected to DOM!');
      this.render();
    }
  
    // (3) Called when an observed attribute has been added, removed, or changed.
    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
      console.log(`SimpleTextElement: attribute ${name} changed from ${oldValue} to ${newValue}`);
      if (name === 'data-text') {
        this._text = newValue;
        this.render(); // Re-render when the text attribute changes
      }
    }
  
    // (4) Called when the element is disconnected from the document's DOM.
    disconnectedCallback() {
      console.log('SimpleTextElement: disconnected from DOM.');
      // You could do cleanup here if needed
    }
  
    // Helper method to update the element's display
    private render() {
      // For this super simple version, we directly set the textContent.
      // In a more complex component, you'd likely create and append child elements.
      this.textContent = this._text ? this._text : 'No text provided'; // Display the text or a fallback
    }
  
    // Optional: You could also define getters/setters for programmatic access if needed
    // get text(): string | null {
    //   return this.getAttribute('data-text');
    // }
  
    // set text(value: string | null) {
    //   if (value) {
    //     this.setAttribute('data-text', value);
    //   } else {
    //     this.removeAttribute('data-text');
    //   }
    // }
  
  // (5) Define the custom element (this line is usually moved to the library's index.ts)
  // customElements.define('simple-text-display', SimpleTextElement);
  
}