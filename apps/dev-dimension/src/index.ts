import { DevDimension } from './lib/dev-dimension.element';

// Define the custom element with the browser
// The first argument is the HTML tag name (must contain a hyphen)
// The second argument is the class that defines its behavior
if (!customElements.get('dev-dimension')) {
  customElements.define('dev-dimension', DevDimension);
}

// You can also export the class if you want consumers to be able to import it directly
// for type checking or programmatic instantiation (though usually not needed for basic usage).
// export { SimpleTextElement };

// You can export other things from your library here if needed
console.log('dev dimension library loaded and component defined.');