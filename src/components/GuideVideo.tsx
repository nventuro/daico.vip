import { YOUTUBE_EMBED_URL, YOUTUBE_WATCH_URL } from '../types';
import { useOnline } from '../hooks/useOnline';

interface Props {
  id: string;
  /** Playback start offset in seconds. */
  start: number;
}

/** An embedded YouTube video; offline it degrades to a link. */
export default function GuideVideo({ id, start }: Props) {
  const online = useOnline();

  if (!online) {
    return (
      <p className="my-4 rounded-lg bg-border-subtle px-3 py-2 text-sm text-muted">
        <a
          href={`${YOUTUBE_WATCH_URL}${id}&t=${start}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          Video de YouTube
        </a>{' '}
        (necesitás conexión para verlo)
      </p>
    );
  }

  return (
    <div className="my-4 aspect-video w-full overflow-hidden rounded-lg bg-border-subtle">
      <iframe
        src={`${YOUTUBE_EMBED_URL}${id}?start=${start}`}
        title="Video de YouTube"
        className="h-full w-full"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
