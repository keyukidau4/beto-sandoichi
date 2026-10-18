import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";

interface PaymentOptionsProps {
  totalAmount: number;
  onPaymentSelect: (
    paymentType: "代引き" | "ポイント",
    pointsToUse?: number
  ) => void;
  selectedPayment?: "代引き" | "ポイント";
  pointsToUse?: number;
  className?: string;
  onValidationError?: (error: string | null) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  totalAmount,
  onPaymentSelect,
  selectedPayment,
  pointsToUse = 0,
  className = "",
  onValidationError,
}) => {
  const { user, buyerProfile } = useAppSelector((state) => state.auth);
  const [localSelectedPayment, setLocalSelectedPayment] = useState<
    "代引き" | "ポイント"
  >(selectedPayment || "代引き");
  const [localPointsToUse, setLocalPointsToUse] = useState(pointsToUse);
  const [pointsError, setPointsError] = useState<string>("");

  // Check if user is approved to use points
  const canUsePoints =
    user?.status === "approved" && buyerProfile && buyerProfile.point > 0 && buyerProfile.point>=totalAmount;
  const availablePoints = buyerProfile?.point || 0;
  const maxPointsUsable = Math.min(availablePoints, totalAmount);

  useEffect(() => {
    // Reset points when switching payment methods
    if (localSelectedPayment === "代引き") {
      setLocalPointsToUse(0);
      setPointsError("");
    }
  }, [localSelectedPayment]);

  const handlePaymentChange = (paymentType: "代引き" | "ポイント") => {
    setLocalSelectedPayment(paymentType);
    if (paymentType === "代引き") {
      // Clear any validation errors when switching to COD
      onValidationError?.(null);
      onPaymentSelect(paymentType);
    } else {
      // For points, validate available balance first
      if (availablePoints === 0) {
        const error = "利用可能なポイントがありません";
        setPointsError(error);
        onValidationError?.(error);
        return;
      }
      
      if (totalAmount === 0) {
        const error = "注文金額が0円の場合はポイント支払いを選択できません";
        setPointsError(error);
        onValidationError?.(error);
        return;
      }

      if(totalAmount > availablePoints ) {
        const error = "利用可能なポイントが足りません";
        setPointsError(error);
        onValidationError?.(error);
        return;
      }
      
      // For points, we need to validate the amount first
      const pointsAmount = localPointsToUse || Math.min(maxPointsUsable, totalAmount);
      handlePointsChange(pointsAmount);
    }
  };

  const handlePointsChange = (points: number) => {
    setPointsError("");
    
    // Enhanced validation with detailed error messages
    if (points < 0) {
      const error = "ポイントは0以上で入力してください";
      setPointsError(error);
      onValidationError?.(error);
      return;
    }

    if (points > availablePoints) {
      const error = `利用可能ポイントは${availablePoints.toLocaleString()}ポイントです`;
      setPointsError(error);
      onValidationError?.(error);
      return;
    }

    if (points > totalAmount) {
      const error = `注文金額（¥${totalAmount.toLocaleString()}）を超えるポイントは使用できません`;
      setPointsError(error);
      onValidationError?.(error);
      return;
    }

    // Additional validation for minimum order amount if needed
    if (localSelectedPayment === "ポイント" && points === totalAmount && totalAmount === 0) {
      const error = "注文金額が0円の場合はポイント支払いを選択できません";
      setPointsError(error);
      onValidationError?.(error);
      return;
    }

    // Clear validation error when points are valid
    onValidationError?.(null);
    setLocalPointsToUse(points);
    onPaymentSelect("ポイント", points);
  };

  const handleMaxPointsClick = () => {
    handlePointsChange(maxPointsUsable);
  };

  const finalAmount =
    localSelectedPayment === "ポイント"
      ? totalAmount - localPointsToUse
      : totalAmount;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">お支払い方法</h2>
        <p className="text-sm text-gray-600 mt-1">
          お支払い方法を選択してください
        </p>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* COD Payment Option */}
        <div className="flex items-start space-x-3">
          <input
            type="radio"
            id="cod"
            name="payment"
            value="代引き"
            checked={localSelectedPayment === "代引き"}
            onChange={() => handlePaymentChange("代引き")}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <div className="flex-1">
            <label
              htmlFor="cod"
              className="block text-sm font-medium text-gray-900 cursor-pointer"
            >
              代引き（現金）
            </label>
            <p className="text-sm text-gray-600 mt-1">
              商品受け取り時に現金でお支払いください
            </p>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">お支払い金額:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ¥{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Points Payment Option */}
        <div className="flex items-start space-x-3">
          <input
            type="radio"
            id="points"
            name="payment"
            value="ポイント"
            checked={localSelectedPayment === "ポイント"}
            onChange={() => handlePaymentChange("ポイント")}
            disabled={!canUsePoints}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
          />
          <div className="flex-1">
            <label
              htmlFor="points"
              className={`block text-sm font-medium cursor-pointer ${
                canUsePoints ? "text-gray-900" : "text-gray-400"
              }`}
            >
              ポイント支払い
            </label>

            {!canUsePoints ? (
              <div className="mt-1">
                {user?.status !== "approved" ? (
                  <p className="text-sm text-gray-500">
                    ポイント支払いをご利用いただくには、アカウントの承認が必要です
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    利用可能なポイントが{buyerProfile && buyerProfile.point < totalAmount ? `足りません(${buyerProfile.point}pt)` : 'ありません'}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mt-1">
                  保有ポイント: {availablePoints.toLocaleString()}ポイント
                </p>

                {localSelectedPayment === "ポイント" && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label
                        htmlFor="pointsAmount"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        使用ポイント数
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          id="pointsAmount"
                          min="0"
                          max={maxPointsUsable}
                          value={localPointsToUse}
                          onChange={(e) =>
                            handlePointsChange(parseInt(e.target.value) || 0)
                          }
                          className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            pointsError
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={handleMaxPointsClick}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          最大
                        </button>
                      </div>
                      {pointsError && (
                        <p className="mt-1 text-sm text-red-600">
                          {pointsError}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        最大 {maxPointsUsable.toLocaleString()}
                        ポイントまで使用可能
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">注文金額:</span>
                          <span>¥{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">使用ポイント:</span>
                          <span className="text-blue-600">
                            -¥{localPointsToUse.toLocaleString()}
                          </span>
                        </div>
                        <div className="border-t border-blue-200 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">
                              お支払い金額:
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                              ¥{finalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              お支払い詳細
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">選択した支払い方法:</span>
                <span className="font-medium">
                  {localSelectedPayment === "代引き"
                    ? "代引き（現金）"
                    : "ポイント支払い"}
                </span>
              </div>
              {localSelectedPayment === "ポイント" && localPointsToUse > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">使用ポイント:</span>
                    <span>{localPointsToUse.toLocaleString()}ポイント</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">残りポイント:</span>
                    <span>
                      {(availablePoints - localPointsToUse).toLocaleString()}
                      ポイント
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
                <span>最終お支払い金額:</span>
                <span className="text-blue-600">
                  ¥{finalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptions;
