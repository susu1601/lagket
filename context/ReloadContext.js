import React, { createContext, useCallback, useMemo, useState } from "react";

export const ReloadContext = createContext({ reloadApp: () => {} });

export function ReloadProvider({ children }) {
  const [reloadKey, setReloadKey] = useState(0);

  const reloadApp = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const value = useMemo(() => ({ reloadApp }), [reloadApp]);

  return (
    <ReloadContext.Provider value={value}>
      {React.cloneElement(children, { key: reloadKey })}
    </ReloadContext.Provider>
  );
}


