import { useRef, useEffect } from 'react';

export function useRenderLogger(name: string) {
  const countRef = useRef(0);
  useEffect(() => {
    countRef.current += 1;
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(`[render] ${name} #${countRef.current}`);
    }
  });
}

export default null;
