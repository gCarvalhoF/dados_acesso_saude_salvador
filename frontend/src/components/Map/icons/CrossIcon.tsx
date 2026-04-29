interface Props {
  color: string;
}

export default function CrossIcon({ color }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      {/* white outline drawn slightly larger behind the colored shape */}
      <rect x="9" y="3" width="6" height="18" fill="white" rx="1.5" />
      <rect x="3" y="9" width="18" height="6" fill="white" rx="1.5" />
      <rect x="10" y="4" width="4" height="16" fill={color} rx="1" />
      <rect x="4" y="10" width="16" height="4" fill={color} rx="1" />
    </svg>
  );
}
