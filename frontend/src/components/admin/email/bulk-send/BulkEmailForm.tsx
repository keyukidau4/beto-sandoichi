import React, { useState, useEffect } from "react";
import {
  useGetEmailTemplatesQuery,
  useGetUsersForEmailQuery,
  useSendBulkEmailMutation,
  useGetBulkEmailProgressQuery,
} from "../../../../services/api";
import type { EmailTemplate, BulkSendProgress } from "../../../../types";
import TemplateList from "../templates/TemplateList";
import RecipientSelector from "./RecipientSelector";
import EmailPreview from "./EmailPreview";
import SendProgress from "./SendProgress";
import { AxiosError } from "axios";

const BulkEmailForm: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendProgress, setSendProgress] = useState<BulkSendProgress | null>(
    null
  );
  const [step, setStep] = useState<
    "template" | "recipients" | "preview" | "sending"
  >("template");
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: templatesResponse, isLoading: templatesLoading } =
    useGetEmailTemplatesQuery();
  const { data: usersResponse, isLoading: usersLoading } =
    useGetUsersForEmailQuery();
  const [sendBulkEmail, { isLoading: isSending }] = useSendBulkEmailMutation();

  const templates = templatesResponse?.data || [];
  const users = usersResponse?.data || [];

  // Poll for progress updates when sending
  const { data: progressResponse } = useGetBulkEmailProgressQuery(historyId!, {
    skip: !historyId,
    pollingInterval: 1000, // Poll every second
  });

  // Update progress from API response
  useEffect(() => {
    if (progressResponse?.data) {
      setSendProgress(progressResponse.data);

      // Stop polling when complete
      if (progressResponse.data.isComplete) {
        setHistoryId(null);

        // Show completion notification
        const { sent, failed } = progressResponse.data;
        if (failed === 0) {
          setNotification({
            type: "success",
            message: `メール送信が完了しました。${sent}件すべて正常に送信されました。`,
          });
        } else {
          setNotification({
            type: "error",
            message: `メール送信が完了しました。${sent}件成功、${failed}件失敗しました。`,
          });
        }
      }
    }
  }, [progressResponse]);

  // Send bulk email using API
  const handleSendEmail = async () => {
    if (!selectedTemplate || selectedRecipients.length === 0) return;

    try {
      setStep("sending");
      setNotification(null);

      // Initialize progress
      const initialProgress: BulkSendProgress = {
        total: selectedRecipients.length,
        sent: 0,
        failed: 0,
        current: "",
        isComplete: false,
      };
      setSendProgress(initialProgress);

      // Send bulk email request
      const response = await sendBulkEmail({
        templateId: selectedTemplate._id,
        recipientIds: selectedRecipients,
      }).unwrap();

      // Start polling for progress
      setHistoryId(response.data.historyId);
    } catch (error: unknown) {
      console.error("Failed to send bulk email:", error);

      let errorMessage = "メール送信の開始に失敗しました。";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error instanceof AxiosError) {
        errorMessage = error.message;
      }

      setNotification({
        type: "error",
        message: errorMessage,
      });
      setStep("preview"); // Go back to preview step
      setSendProgress(null);
    }
  };

  const handleReset = () => {
    setSelectedTemplate(null);
    setSelectedRecipients([]);
    setSendProgress(null);
    setHistoryId(null);
    setNotification(null);
    setStep("template");
  };

  const getStepTitle = () => {
    switch (step) {
      case "template":
        return "ステップ 1: テンプレート選択";
      case "recipients":
        return "ステップ 2: 送信先選択";
      case "preview":
        return "ステップ 3: 送信内容確認";
      case "sending":
        return "ステップ 4: 送信中";
      default:
        return "";
    }
  };

  const canProceedToNext = () => {
    switch (step) {
      case "template":
        return selectedTemplate !== null;
      case "recipients":
        return selectedRecipients.length > 0;
      case "preview":
        return true;
      default:
        return false;
    }
  };

  if (templatesLoading || usersLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-md border ${
            notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>{notification.type === "success" ? "✅" : "❌"}</span>
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          {["template", "recipients", "preview", "sending"].map(
            (stepName, index) => {
              const isActive = step === stepName;
              const isCompleted =
                ["template", "recipients", "preview", "sending"].indexOf(step) >
                index;
              const stepNumber = index + 1;

              return (
                <div key={stepName} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {isCompleted ? "✓" : stepNumber}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        isCompleted ? "bg-green-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{getStepTitle()}</h3>
        </div>

        <div className="p-6">
          {step === "template" && (
            <div className="space-y-4">
              <p className="text-gray-600">
                送信に使用するメールテンプレートを選択してください。
              </p>
              <TemplateList
                templates={templates}
                onEdit={() => {}} // Disable editing in this context
                onSelect={(template) => {
                  // Ensure we have a valid template object
                  if (
                    template &&
                    typeof template === "object" &&
                    template._id
                  ) {
                    setSelectedTemplate(template);
                  }
                }}
                selectedTemplateId={selectedTemplate?._id}
                selectable={true}
              />
            </div>
          )}

          {step === "recipients" && (
            <div className="space-y-4">
              <p className="text-gray-600">
                メールを送信するユーザーを選択してください（最大10人まで）。
              </p>
              <RecipientSelector
                selectedRecipients={selectedRecipients}
                onSelectionChange={setSelectedRecipients}
                maxRecipients={10}
              />
            </div>
          )}

          {step === "preview" && selectedTemplate && (
            <div className="space-y-4">
              <p className="text-gray-600">
                送信内容を確認してください。問題なければ送信ボタンをクリックしてください。
              </p>
              {selectedTemplate &&
              typeof selectedTemplate === "object" &&
              selectedTemplate._id ? (
                <EmailPreview
                  template={selectedTemplate}
                  recipientCount={selectedRecipients.length}
                  sampleRecipient={(() => {
                    const sampleUser = users.find((u) =>
                      selectedRecipients.includes(u._id)
                    );
                    return {
                      name: sampleUser?.name || "田中太郎",
                      email: sampleUser?.email || "tanaka@example.com",
                      point: 1500, // Default point value since it's not available in the user data
                    };
                  })()}
                />
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">
                    テンプレートデータに問題があります。再度選択してください。
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "sending" && sendProgress && (
            <div className="space-y-4">
              <p className="text-gray-600">
                メールを送信しています。しばらくお待ちください。
              </p>
              <SendProgress
                progress={sendProgress}
                onClose={sendProgress.isComplete ? handleReset : undefined}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <div>
            {step !== "template" && step !== "sending" && (
              <button
                onClick={() => {
                  const steps = ["template", "recipients", "preview"];
                  const currentIndex = steps.indexOf(step);
                  if (currentIndex > 0) {
                    setStep(steps[currentIndex - 1] as "template"|"recipients"|"preview");
                  }
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                戻る
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {step !== "sending" && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                リセット
              </button>
            )}

            {step === "template" && (
              <button
                onClick={() => setStep("recipients")}
                disabled={!canProceedToNext()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            )}

            {step === "recipients" && (
              <button
                onClick={() => setStep("preview")}
                disabled={!canProceedToNext()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            )}

            {step === "preview" && (
              <button
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>📧</span>
                <span>{isSending ? "送信準備中..." : "送信開始"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEmailForm;
