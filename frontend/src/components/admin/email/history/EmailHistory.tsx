import React, { useState } from "react";
import type { EmailHistoryItem } from "../../../../types";
import HistoryFilters from "./HistoryFilters";
import EmailDetail from "./EmailDetail";
import ResendModal from "./ResendModal";
import EmailStatusBadge from "../common/EmailStatusBadge";
import {
  useGetEmailHistoryQuery,
  useResendFailedEmailsMutation,
} from "../../../../services/api";
import { LoadingSpinner } from "../../../common";
import { useNotification } from "../../../../hooks";

const EmailHistory: React.FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    templateType: "",
    status: "",
    searchTerm: "",
  });

  const [selectedEmail, setSelectedEmail] = useState<EmailHistoryItem | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { success: showSuccess, error: showError } = useNotification();

  // API query for email history
  const {
    data: emailHistoryResponse,
    isLoading,
    error,
    refetch,
  } = useGetEmailHistoryQuery({
    page: currentPage,
    limit: itemsPerPage,
    ...filters,
  });

  console.log({emailHistoryResponse});
  

  const [resendFailedEmails, { isLoading: isResending }] =
    useResendFailedEmailsMutation();

  const emailHistory = emailHistoryResponse?.data.history || [];

  const handleFiltersChange = (newFilters: {
    dateFrom: "";
    dateTo: "";
    templateType: "";
    status: "";
    searchTerm: "";
  }) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      templateType: "",
      status: "",
      searchTerm: "",
    });
    setCurrentPage(1);
  };

  const handleViewDetail = (email: EmailHistoryItem) => {
    setSelectedEmail(email);
    setShowDetail(true);
  };

  const handleResend = (email: EmailHistoryItem) => {
    setSelectedEmail(email);
    setShowResendModal(true);
  };

  const handleResendFromDetail = (historyId: string) => {
    const email = emailHistory.find((e) => e._id === historyId);
    if (email) {
      handleResend(email);
    }
  };

  const handleConfirmResend = async (
    historyId: string,
    recipientIds: string[]
  ) => {
    try {
      await resendFailedEmails({ historyId, recipientIds }).unwrap();
      showSuccess(`${recipientIds.length}件のメールを再送信しました`);
      setShowResendModal(false);
      setSelectedEmail(null);
      refetch(); // Refresh the history list
    } catch (error) {
      console.error("Failed to resend emails:", error);
      showError("メールの再送信に失敗しました");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSuccessRate = (email: EmailHistoryItem) => {
    if (email.recipientCount === 0) return 0;
    return Math.round((email.successCount / email.recipientCount) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <HistoryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />
        <div className="bg-white rounded-lg shadow-md p-8">
          <LoadingSpinner />
          <p className="text-center text-gray-600 mt-4">
            メール履歴を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <HistoryFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              データの読み込みに失敗しました
            </h3>
            <p className="text-gray-500 mb-4">
              メール履歴の取得中にエラーが発生しました
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <HistoryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* History List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">メール送信履歴</h3>
            <span className="text-sm text-gray-500">
              {emailHistory.length}件
            </span>
          </div>
        </div>

        {emailHistory.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              送信履歴がありません
            </h3>
            <p className="text-gray-500">
              メールを送信すると、ここに履歴が表示されます
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {emailHistory.map((email) => (
              <div
                key={email._id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {email.templateTitle}
                      </h4>
                      <EmailStatusBadge status={email.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">送信日時:</span>
                        <br />
                        {formatDate(email.sentAt)}
                      </div>
                      <div>
                        <span className="font-medium">送信数:</span>
                        <br />
                        {email.recipientCount}件
                      </div>
                      <div>
                        <span className="font-medium">成功/失敗:</span>
                        <br />
                        <span className="text-green-600">
                          {email.successCount}
                        </span>
                        /
                        <span className="text-red-600">
                          {email.failureCount}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">成功率:</span>
                        <br />
                        <span
                          className={
                            getSuccessRate(email) >= 90
                              ? "text-green-600"
                              : getSuccessRate(email) >= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {getSuccessRate(email)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetail(email)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      詳細
                    </button>

                    {email.failureCount > 0 && (
                      <button
                        onClick={() => handleResend(email)}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium px-3 py-1 rounded hover:bg-orange-50 transition-colors"
                      >
                        再送信
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {emailHistory.length === itemsPerPage && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">ページ {currentPage}</div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={emailHistory.length < itemsPerPage}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEmail && (
        <>
          <EmailDetail
            emailHistory={selectedEmail}
            onClose={() => {
              setShowDetail(false);
              setSelectedEmail(null);
            }}
            onResend={handleResendFromDetail}
            isOpen={showDetail}
          />

          <ResendModal
            emailHistory={selectedEmail}
            onClose={() => {
              setShowResendModal(false);
              setSelectedEmail(null);
            }}
            onConfirm={handleConfirmResend}
            isOpen={showResendModal}
            isLoading={isResending}
          />
        </>
      )}
    </div>
  );
};

export default EmailHistory;
