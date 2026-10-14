import { Landscape } from '../components/Landscape';

/** Shown when the app is missing its public Supabase configuration. */
export default function SetupPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Landscape className="mb-8 h-32 w-full rounded-3xl" />
      <h1 className="text-3xl font-semibold text-accent">Faithly needs to be connected</h1>
      <p className="mt-3 text-subtle">
        This copy of Faithly has not been connected to a Supabase project yet, so sign-in, the Bible and saved data
        cannot work. Nothing here is simulated — once the settings below are added, the app runs for real.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm">
        <li>Create a Supabase project and run the SQL migrations in <code>supabase/migrations</code>.</li>
        <li>Load the Bible text: <code>npm run import-bible</code> (see README).</li>
        <li>Copy <code>.env.example</code> to <code>.env</code> and set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
        <li>Restart the dev server or rebuild the app.</li>
      </ol>
      <p className="mt-6 text-sm text-subtle">Full instructions are in <code>faithly/README.md</code>.</p>
    </div>
  );
}
