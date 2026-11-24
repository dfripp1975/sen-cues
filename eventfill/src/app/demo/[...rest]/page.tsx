import { DemoUnavailable } from "@/components/demo/unavailable";

export default async function Page({ params }: { params: Promise<{ rest: string[] }> }) {
  return <DemoUnavailable rest={(await params).rest} />;
}
