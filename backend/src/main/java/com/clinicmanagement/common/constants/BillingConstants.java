package com.clinicmanagement.common.constants;

public final class BillingConstants {

    private BillingConstants() {
    }

    public static final class AppointmentStatus {
        public static final String PENDING_PAYMENT = "PENDING_PAYMENT";
        public static final String CONFIRMED = "CONFIRMED";
        public static final String CHECKED_IN = "CHECKED_IN";
        public static final String WAITING = "WAITING";
        public static final String IN_PROGRESS = "IN_PROGRESS";
        public static final String PAYMENT_DUE = "PAYMENT_DUE";
        public static final String COMPLETED = "COMPLETED";
        public static final String CANCELLED = "CANCELLED";
        public static final String NO_SHOW = "NO_SHOW";
        public static final String RESCHEDULED = "RESCHEDULED";

        private AppointmentStatus() {
        }
    }

    public static final class InvoiceStatus {
        public static final String UNPAID = "UNPAID";
        public static final String PARTIALLY_PAID = "PARTIALLY_PAID";
        public static final String PAID = "PAID";
        public static final String FAILED = "FAILED";
        public static final String REFUNDED = "REFUNDED";
        public static final String CANCELLED = "CANCELLED";

        private InvoiceStatus() {
        }
    }

    public static final class PaymentStatus {
        public static final String PENDING = "PENDING";
        public static final String PAID = "PAID";
        public static final String FAILED = "FAILED";
        public static final String REFUNDED = "REFUNDED";
        public static final String CANCELLED = "CANCELLED";

        private PaymentStatus() {
        }
    }

    public static final class PaymentType {
        public static final String DEPOSIT = "DEPOSIT";
        public static final String FINAL_PAYMENT = "FINAL_PAYMENT";

        private PaymentType() {
        }
    }

    public static final class PaymentMethod {
        public static final String CASH = "CASH";
        public static final String ONLINE = "ONLINE";
        public static final String BANK_TRANSFER = "BANK_TRANSFER";
        public static final String CARD = "CARD";

        private PaymentMethod() {
        }
    }

    public static final class RefundStatus {
        public static final String PENDING = "PENDING";
        public static final String APPROVED = "APPROVED";
        public static final String REJECTED = "REJECTED";
        public static final String COMPLETED = "COMPLETED";
        public static final String FAILED = "FAILED";

        private RefundStatus() {
        }
    }

    public static final class SettingKeys {
        public static final String DEPOSIT_EXPIRY_MINUTES = "payment.deposit.expiry_minutes";
        public static final String REFUND_FULL_BEFORE_HOURS = "refund.full_before_hours";
        public static final String REFUND_PARTIAL_BEFORE_HOURS = "refund.partial_before_hours";
        public static final String REFUND_PARTIAL_PERCENT = "refund.partial_percent";

        private SettingKeys() {
        }
    }
}
