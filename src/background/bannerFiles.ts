export const isCashbackCampaign = (filesInfo: any) => {
  return (
    filesInfo.desktop?.some((file: any) => file.extra && file.extra.length > 0) ||
    filesInfo.mobile?.some((file: any) => file.extra && file.extra.length > 0)
  );
};

export const findMatchingFiles = (
  filesInfo: any,
  targetSlug: string,
  currentShop: string | undefined,
  deviceType: 'desktop' | 'mobile',
  isCashback = false,
): any[] => {
  const matches: any[] = [];

  if (!filesInfo[deviceType]) return matches;

  for (const file of filesInfo[deviceType]) {
    if (isCashback) {
      matches.push({
        ...file,
        variantKey: file.extra && file.extra.length > 0 ? file.extra.join('-') : 'default',
        priority: 1,
      });
    }
    // for regular campaigns without extra parts
    else if (!isCashback && (!file.extra || file.extra.length === 0)) {
      matches.push({
        ...file,
        priority: 1,
      });
    }
    // for regular campaigns with extra parts
    else if (!isCashback && file.extra && file.extra.length > 0) {
      // check if extra matches current shop
      if (file.extra[0] === currentShop || file.extra[0] === targetSlug) {
        matches.push({
          ...file,
          variantKey: file.extra.join('-'),
          priority: 1,
        });
      } else {
        matches.push({
          ...file,
          variantKey: file.extra.join('-'),
          priority: 3,
        });
      }
    }
  }
  return matches.sort((a, b) => (a.priority || 99) - (b.priority || 99));
};
