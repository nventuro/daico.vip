import type { Components } from 'react-markdown';
import Markdown from '../../components/markdown/Markdown';
import Ingredients from './Ingredients';

// Custom element names come from the directive plugin; react-markdown's
// `Components` type only knows HTML tags, hence the cast.
const recipeComponents = {
  ingredients: ({ items }: { items?: string }) => <Ingredients items={items ?? ''} />,
} as unknown as Components;

/** Renders a recipe body: the shared dialect, with an ingredients block that
 *  ticks off what is at hand and sends the rest to the shopping list. */
export default function RecipeMarkdown({ body }: { body: string }) {
  return <Markdown body={body} components={recipeComponents} />;
}
