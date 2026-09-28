type Props = {
  darkSrc?: string;
  lightSrc?: string;
  height?: number;
  width?: number;
};

// height and width bound the logo box; the image keeps its own aspect ratio inside it.
export function Logo({ lightSrc, darkSrc, height = 40, width = 147.5 }: Props) {
  const imgClassName = "h-auto w-auto object-contain";
  const imgStyle = { maxHeight: height, maxWidth: width };

  return (
    <>
      {darkSrc && (
        <div className="hidden justify-center dark:flex">
          <img height={height} width={width} src={darkSrc} alt="logo" className={imgClassName} style={imgStyle} />
        </div>
      )}
      {lightSrc && (
        <div className="flex justify-center dark:hidden">
          <img height={height} width={width} src={lightSrc} alt="logo" className={imgClassName} style={imgStyle} />
        </div>
      )}
    </>
  );
}
