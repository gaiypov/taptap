/**
 * Why Did You Render — детектор лишних ререндеров
 * 
 * Логирует в консоль когда компонент ререндерится без изменения props/state.
 * Помогает найти проблемы производительности в видео-фиде.
 * 
 * Использование:
 * 1. Импортируется автоматически в _layout.tsx (только в DEV)
 * 2. Для отслеживания конкретного компонента добавь:
 *    MyComponent.whyDidYouRender = true;
 * 
 * @see https://github.com/welldone-software/why-did-you-render
 */

import React from 'react';

// WDYR DISABLED - causes severe performance issues in dev mode
// Uncomment only when debugging specific re-render issues
/*
if (__DEV__) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  
  whyDidYouRender(React, {
    trackAllPureComponents: false, // DON'T track all - too slow!
    trackHooks: false,
    logOnDifferentValues: false,
    collapseGroups: true,
  });
}
*/

