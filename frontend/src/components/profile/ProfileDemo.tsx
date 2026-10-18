import { useState } from "react";
import { Container, Card, TabNavigation } from "../common";
import {
  BuyerProfile,
  PointHistory,
  ContactRequestForm,
  ContactRequestHistory,
} from "./";
import { OrderHistory } from "../order";

const ProfileDemo = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "プロフィール" },
    { id: "orders", label: "注文履歴" },
    { id: "points", label: "ポイント履歴" },
    { id: "contact", label: "問い合わせ" },
    { id: "contact-history", label: "問い合わせ履歴" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <BuyerProfile />;
      case "orders":
        return <OrderHistory />;
      case "points":
        return <PointHistory />;
      case "contact":
        return <ContactRequestForm />;
      case "contact-history":
        return <ContactRequestHistory />;
      default:
        return <BuyerProfile />;
    }
  };

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 font-japanese">
          マイページ
        </h1>
        <p className="text-gray-600">プロフィール情報とアカウント設定</p>
      </div>

      <Card className="mb-6">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </Card>

      <div className="mt-6">{renderTabContent()}</div>
    </Container>
  );
};

export default ProfileDemo;
