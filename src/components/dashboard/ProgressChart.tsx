import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  label: string;
  value: string;
}

export function ProgressRing({ progress, size, strokeWidth, label, value }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center pt-0">
        <div className="relative inline-flex items-center justify-center">
          <svg height={size} width={size} className="transform -rotate-90">
            <circle
              className="text-muted"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
              opacity={0.2}
            />
            <circle
              className="text-primary"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </svg>
          <span className="absolute text-2xl font-bold">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}