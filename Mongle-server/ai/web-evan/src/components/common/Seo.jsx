import { useEffect } from 'react';

const DEFAULT_DESCRIPTION =
  '몽글 플래너 관리자 웹에서 커플 일정, 예산, 알림, 협력 업체 현황을 빠르게 관리하세요.';

function ensureMetaDescription() {
  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }

  return meta;
}

export default function Seo({ title, description = DEFAULT_DESCRIPTION }) {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = ensureMetaDescription();
    const previousDescription = meta.getAttribute('content') ?? '';

    document.title = title;
    meta.setAttribute('content', description);

    return () => {
      document.title = previousTitle;
      meta.setAttribute('content', previousDescription);
    };
  }, [description, title]);

  return null;
}
