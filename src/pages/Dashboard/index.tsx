type DashboardProps = {
  email: string;
  onLogout: () => void;
};

const Dashboard: React.FC<DashboardProps> = ({ email, onLogout }) => {
  return <div className="min-h-screen w-full"></div>;
};

export default Dashboard;
