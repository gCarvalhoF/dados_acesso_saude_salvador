interface Props {
  color: string;
}

export default function TriangleIcon({ color }: Props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <polygon points="12,3 22,21 2,21" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  );
}
