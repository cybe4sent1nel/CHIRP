import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const LinkPreview = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    import React, { useEffect, useState } from 'react';
    import api from '../api/axios';

    const LinkPreview = ({ url }) => {
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
      const [preview, setPreview] = useState(null);

      useEffect(() => {
        let mounted = true;
        const fetchPreview = async () => {
          try {
            setLoading(true);
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

      if (loading) return null;
      if (error || !preview) return null;

      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="flex gap-3 bg-white">
            {preview.image ? (
              <img src={preview.image} alt={preview.title || url} className="w-28 h-20 object-cover" />
            ) : (
              <div className="w-28 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500">Preview</div>
            )}
            <div className="p-2 flex-1">
              <div className="font-semibold text-sm text-gray-900 truncate">{preview.title || url}</div>
              <div className="text-xs text-gray-600 line-clamp-2 mt-1">{preview.description}</div>
              <div className="text-xs text-gray-400 mt-2">{preview.site}</div>
            </div>
          </div>
        </a>
      );
    };

    export default LinkPreview;
