import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const LinkPreviewClean = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [shortUrl, setShortUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPreview = async () => {
      try {
        setLoading(true);
        // Fetch preview metadata
        const { data } = await api.post('/api/preview', { url });
        if (!mounted) return;
        if (data && data.success) {
          setPreview(data.preview || null);
        } else {
          setError('No preview available');
        }
      } catch (e) {
        setError('Failed to load preview');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => { mounted = false; };
  }, [url]);

  // Create or fetch shortlink for masking (hook moved up to avoid conditional hooks)
  useEffect(() => {
    let mounted2 = true;
    const makeShort = async () => {
      try {
        const { data: s } = await api.post('/api/shortlink', { url });
        if (!mounted2) return;
        if (s && s.success) setShortUrl(s.shortUrl || null);
      } catch (e) {
        // ignore shortlink failures
      }
    };
    makeShort();
    return () => { mounted2 = false; };
  }, [url]);

  if (loading) return null;
  if (error || !preview) return null;

  const href = shortUrl || url;
  // normalize image URL (handle protocol-relative and root-relative paths)
  const normalizeImage = (img) => {
    if (!img) return null;
    try {
      // if protocol relative //host/path
      if (img.startsWith('//')) return `https:${img}`;
      // absolute URL already
      if (/^https?:\/\//i.test(img)) return img;
      // relative path -> derive origin from preview.url or fallback to provided url
      const base = preview?.url || url;
      const u = new URL(base);
      if (img.startsWith('/')) return `${u.origin}${img}`;
      // otherwise try to resolve relative
      return new URL(img, u).toString();
    } catch (e) {
      return img;
    }
  };

  const rawImage = preview.image || preview.image_url || preview.thumbnail || null;
  const imageSrc = rawImage ? normalizeImage(rawImage) : null;

  const domain = (() => {
    try { return new URL(preview?.url || url).hostname.replace('www.', ''); } catch (e) { return preview?.site || url; }
  })();

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="flex gap-3 bg-white">
        {imageSrc && !imageError ? (
          <img src={imageSrc} alt={preview.title || url} className="w-28 h-20 object-cover" onError={() => setImageError(true)} />
        ) : (
          <div className="w-28 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500 px-2">
            <div className="flex items-center gap-2">
              {preview.favicon ? (
                <img src={normalizeImage(preview.favicon)} alt="favicon" className="w-6 h-6 rounded-sm object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
              ) : (
                <div className="w-6 h-6 rounded-sm bg-gray-300 flex items-center justify-center text-xs font-semibold">{(domain||'')?.charAt(0)?.toUpperCase() || '·'}</div>
              )}
              <div className="text-left">
                <div className="font-semibold text-xs text-gray-800 truncate" style={{maxWidth:120}}>{domain}</div>
                <div className="text-[11px] text-gray-500">{preview.site || ''}</div>
              </div>
            </div>
          </div>
        )}
        <div className="p-2 flex-1">
          <div className="font-semibold text-sm text-gray-900 truncate">{preview.title || url}</div>
          <div className="text-xs text-gray-600 line-clamp-2 mt-1">{preview.description || preview.excerpt || ''}</div>
          <div className="text-xs text-gray-400 mt-2">{preview.site || domain}</div>
        </div>
      </div>
    </a>
  );
};

export default LinkPreviewClean;
