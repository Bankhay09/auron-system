import { AppShell } from "@/components/layout/AppShell";
import { DiaryClient } from "@/components/diary/DiaryClient";

export default function DiaryPage() {
  return (
    <AppShell>
      <DiaryClient />
    </AppShell>
  );
}
