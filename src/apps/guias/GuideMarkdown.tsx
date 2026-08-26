import type { Components } from 'react-markdown';
import Markdown from '../../components/Markdown';
import GuideImage from './GuideImage';

// Custom element names come from the directive plugin; react-markdown's
// `Components` type only knows HTML tags, hence the cast.
const guideComponents = {
  image: ({ imageKey, width, align }: { imageKey: string; width?: string; align?: string }) => (
    <GuideImage
      key={imageKey}
      imageKey={imageKey}
      width={Number(width) || 100}
      align={align === 'left' || align === 'right' ? align : 'center'}
    />
  ),
} as unknown as Components;

/** Renders a chapter body: the shared dialect, with images resolved through
 *  the guides' image cache. */
export default function GuideMarkdown({ body }: { body: string }) {
  return <Markdown body={body} components={guideComponents} />;
}
