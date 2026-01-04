import AppHeader from "../Header/AppHeader";
import AppFooter from "../Footer/Footer"; 
import "./layout.css";


export default function Layout({ children }) {
  return (
    <>
      <AppHeader />
      <div className="page-content">
        {children}
      </div>
      <AppFooter />
    </>
  );
}
