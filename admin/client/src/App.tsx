import { Switch, Route } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import Inventory from "@/pages/Inventory";
import Recipes from "@/pages/Recipes";
import Prices from "@/pages/Prices";
import Orders from "@/pages/Orders";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/materials" component={Materials} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/recipes" component={Recipes} />
          <Route path="/prices" component={Prices} />
          <Route path="/orders" component={Orders} />
          <Route path="/orders/:orderId" component={Orders} />
          <Route path="/reports" component={Reports} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
      <Toaster />
    </>
  );
}

export default App;
