import { YOUTUBE_EMBED_URL, YOUTUBE_ID_PATTERN, YOUTUBE_WATCH_URL } from '../../config';
import { useOnline } from '../../hooks/useOnline';

interface Props {
  id: string;
  /** Playback start offset in seconds. */
  start: number;
}

/** An embedded YouTube video; offline it degrades to a link. Nothing is drawn
 *  for anything but a video id: what the directive carries ends up in the
 *  frame's address, and imported content is only as careful as its source. */
export default function GuideVideo({ id, start }: Props) {
  const online = useOnline();

  if (!YOUTUBE_ID_PATTERN.test(id)) return null;
  const from = Number.isFinite(start) ? Math.max(0, Math.trunc(start)) : 0;

  if (!online) {
    return (
      <p className="my-4 bg-border-subtle px-3 py-2 text-sm text-muted">
        <a
          href={`${YOUTUBE_WATCH_URL}${id}&t=${from}`}
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
    <div className="my-4 aspect-video w-full overflow-hidden bg-border-subtle">
      <iframe
        src={`${YOUTUBE_EMBED_URL}${id}?start=${from}`}
        title="Video de YouTube"
        className="h-full w-full"
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
}
