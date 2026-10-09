import { createFileRoute } from "@tanstack/react-router";
import { ScaleLab } from "@/components/scale-lab";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ScaleLab />;
}
