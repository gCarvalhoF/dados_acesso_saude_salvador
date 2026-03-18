interface Props {
  color: string;
}

export default function CrossIcon({ color }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <rect x="10" y="4" width="4" height="16" fill={color} rx="1" />
      <rect x="4" y="10" width="16" height="4" fill={color} rx="1" />
    </svg>
  );
}
