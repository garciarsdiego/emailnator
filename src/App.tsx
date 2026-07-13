import { AppProviders } from "@/app/providers/AppProviders";
import { AppRouter } from "@/app/router/AppRouter";
import { SkipLink } from "@/components/v2/SkipLink";

const App = () => (
  <AppProviders>
    <SkipLink />
    <AppRouter />
  </AppProviders>
);

export default App;
