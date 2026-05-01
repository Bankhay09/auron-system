import { XpBar } from "../XpBar";

export function HabitGraph({ skills }: { skills: { id: string; name: string; value: number }[] }) {
  return (
    <div className="grid gap-3">
      {skills.map((habit) => (
        <XpBar key={habit.id} label={habit.name} value={habit.value} max={100} />
      ))}
    </div>
  );
}
