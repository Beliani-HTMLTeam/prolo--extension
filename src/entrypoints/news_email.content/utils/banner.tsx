const Banner = ({ date, type }: { date: string; type: 'mobile' | 'desktop' }) => {
  const handleImageError = (event: any) => {
    event.currentTarget.src = `https://placehold.co/${type === 'mobile' ? '650x490' : '610x181'}`;
  };

  let formatDate = date.replace(/\./g, '');

  let src = `https://pictureserver.net/static/2026/uk${formatDate}${type === 'mobile' ? '_mb' : 'b'}.png`;

  return <img onError={handleImageError} src={src} alt={`Banner for ${date} - ${type}`} />;
};

export { Banner };
