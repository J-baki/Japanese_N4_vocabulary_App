import { AppProvider, useApp } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { HomeDashboard } from "@/pages/HomeDashboard";
import { LessonsPage, LessonDetailPage } from "@/pages/LessonsPage";
import { ExamSetupPage } from "@/pages/ExamSetupPage";
import { ExamPlayPage } from "@/pages/ExamPlayPage";
import { ExamResultPage } from "@/pages/ExamResultPage";
import { MemoryPage, MemoryLessonPage } from "@/pages/MemoryPage";
import { ImprovementPage } from "@/pages/ImprovementPage";
import { StreakPage } from "@/pages/StreakPage";
import { ScoresPage } from "@/pages/ScoresPage";
import { SettingsPage } from "@/pages/SettingsPage";

function PageRouter() {
  const { page } = useApp();

  switch (page) {
    case "home":
      return <HomeDashboard />;
    case "lessons":
      return <LessonsPage />;
    case "lessonDetail":
      return <LessonDetailPage />;
    case "examSetup":
      return <ExamSetupPage />;
    case "examPlay":
      return <ExamPlayPage />;
    case "examResult":
      return <ExamResultPage />;
    case "memory":
      return <MemoryPage />;
    case "memoryLesson":
      return <MemoryLessonPage />;
    case "improvement":
      return <ImprovementPage />;
    case "streak":
      return <StreakPage />;
    case "scores":
      return <ScoresPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return <HomeDashboard />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <PageRouter />
      </Layout>
    </AppProvider>
  );
}
