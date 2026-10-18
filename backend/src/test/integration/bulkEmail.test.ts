import request from "supertest";
import { createTestApp } from "../app";
import { User } from "../../models/User";
import { BuyerProfile } from "../../models/BuyerProfile";
import { EmailTemplate } from "../../models/EmailTemplate";
import { EmailHistory } from "../../models/EmailHistory";
import { EmailRecipient } from "../../models/EmailRecipient";
import bcrypt from "bcryptjs";

// Helper function to extract token from cookie header
const extractTokenFromCookie = (headers: any): string => {
  const cookieHeader = headers["set-cookie"]?.find((cookie: string) =>
    cookie.startsWith("token-banhmi=")
  );
  return cookieHeader ? cookieHeader.split("=")[1].split(";")[0] : "";
};

const app = createTestApp();

// Mock nodemailer for testing
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((mailOptions, callback) => {
      // Simulate successful email sending
      if (callback) {
        callback(null, {
          messageId: "test-message-id",
          response: "250 OK",
        });
      }
      return Promise.resolve({
        messageId: "test-message-id",
        response: "250 OK",
      });
    }),
  })),
}));

describe("Bulk Email API", () => {
  let adminToken: string;
  let adminUser: any;
  let testTemplate: any;
  let testBuyers: any[] = [];

  beforeAll(async () => {
    // Hash password for admin user
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Create admin user
    adminUser = await User.create({
      email: "admin@test.com",
      password: hashedPassword,
      role: "admin",
      status: "approved",
    });

    // Get admin token by logging in
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "password123" });

    console.log("Admin login status:", adminLogin.status);
    console.log("Admin login body:", adminLogin.body);
    console.log("Admin login headers:", adminLogin.headers);

    adminToken = extractTokenFromCookie(adminLogin.headers);

    if (!adminToken) {
      console.log("No token found in cookies");
      throw new Error("Failed to get admin token for testing");
    }

    // Create test email template
    testTemplate = await EmailTemplate.create({
      title: "Test Bulk Email",
      content: "<h1>Hello {{name}}</h1><p>Your current points: {{point}}</p>",
      type: "general",
      placeholders: ["{{name}}", "{{point}}"],
      isDefault: false,
    });

    // Create test buyers
    for (let i = 1; i <= 3; i++) {
      const hashedBuyerPassword = await bcrypt.hash("password123", 12);
      const user = await User.create({
        email: `buyer${i}@test.com`,
        password: hashedBuyerPassword,
        role: "buyer",
        status: "approved",
      });

      const profile = await BuyerProfile.create({
        userId: user._id,
        name: `Test Buyer ${i}`,
        tel: "090-1234-567" + i,
        zip1: "123",
        zip2: "4567",
        address1: `Test Address ${i}`,
        point: i * 100,
      });

      testBuyers.push({ user, profile });
    }
  });

  afterAll(async () => {
    // Test cleanup is handled by setup.ts
  });

  describe("GET /api/admin/email/recipients", () => {
    it("should get available email recipients", async () => {
      const response = await request(app)
        .get("/api/admin/email/recipients")
        .set("Cookie", `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty("email");
      expect(response.body.data[0]).toHaveProperty("name");
      expect(response.body.data[0]).toHaveProperty("point");
    });

    it("should require admin authentication", async () => {
      await request(app).get("/api/admin/email/recipients").expect(401);
    });
  });

  describe("POST /api/admin/email/send-bulk", () => {
    it("should initiate bulk email sending", async () => {
      const recipientIds = testBuyers.map((buyer) => buyer.user._id.toString());

      const response = await request(app)
        .post("/api/admin/email/send-bulk")
        .set("Cookie", `token-banhmi=${adminToken}`)
        .send({
          templateId: testTemplate._id.toString(),
          recipientIds: recipientIds,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("historyId");
      expect(response.body.data.recipientCount).toBe(3);
      expect(response.body.data.status).toBe("sending");

      // Verify EmailHistory was created
      const history = await EmailHistory.findById(response.body.data.historyId);
      expect(history).toBeTruthy();
      expect(history?.recipientCount).toBe(3);
      expect(history?.status).toBe("sending");

      // Verify EmailRecipient records were created
      const recipients = await EmailRecipient.find({
        historyId: response.body.data.historyId,
      });
      expect(recipients).toHaveLength(3);
      expect(recipients[0].status).toBe("pending");
    });

    it("should reject more than 10 recipients", async () => {
      // Create array with 11 recipient IDs (using duplicates for test)
      const recipientIds = Array(11).fill(testBuyers[0].user._id.toString());

      const response = await request(app)
        .post("/api/admin/email/send-bulk")
        .set("Cookie", `token-banhmi=${adminToken}`)
        .send({
          templateId: testTemplate._id.toString(),
          recipientIds: recipientIds,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Maximum 10 recipients");
    });

    it("should reject invalid template ID", async () => {
      const recipientIds = [testBuyers[0].user._id.toString()];

      const response = await request(app)
        .post("/api/admin/email/send-bulk")
        .set("Cookie", `token-banhmi=${adminToken}`)
        .send({
          templateId: "507f1f77bcf86cd799439011", // Non-existent ID
          recipientIds: recipientIds,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Email template not found");
    });

    it("should require template ID and recipient IDs", async () => {
      const response = await request(app)
        .post("/api/admin/email/send-bulk")
        .set("Cookie", `token-banhmi=${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "Template ID and recipient IDs are required"
      );
    });

    it("should require admin authentication", async () => {
      await request(app)
        .post("/api/admin/email/send-bulk")
        .send({
          templateId: testTemplate._id.toString(),
          recipientIds: [testBuyers[0].user._id.toString()],
        })
        .expect(401);
    });
  });

  describe("GET /api/admin/email/send-progress/:id", () => {
    let testHistoryId: string;

    beforeEach(async () => {
      // Create a test email history
      const history = await EmailHistory.create({
        templateId: testTemplate._id,
        templateTitle: testTemplate.title,
        templateContent: testTemplate.content,
        recipientCount: 2,
        successCount: 1,
        failureCount: 1,
        status: "completed",
        sentBy: adminUser._id,
        sentAt: new Date(),
        completedAt: new Date(),
      });

      testHistoryId = history._id.toString();

      // Create test recipients
      await EmailRecipient.create([
        {
          historyId: history._id,
          buyerId: testBuyers[0].user._id,
          buyerName: testBuyers[0].profile.name,
          buyerEmail: testBuyers[0].user.email,
          personalizedContent: "<h1>Hello Test Buyer 1</h1>",
          status: "sent",
          sentAt: new Date(),
        },
        {
          historyId: history._id,
          buyerId: testBuyers[1].user._id,
          buyerName: testBuyers[1].profile.name,
          buyerEmail: testBuyers[1].user.email,
          personalizedContent: "<h1>Hello Test Buyer 2</h1>",
          status: "failed",
          error: "SMTP connection failed",
        },
      ]);
    });

    it("should get bulk email progress", async () => {
      const response = await request(app)
        .get(`/api/admin/email/send-progress/${testHistoryId}`)
        .set("Cookie", `token-banhmi=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("historyId", testHistoryId);
      expect(response.body.data).toHaveProperty("status", "completed");
      expect(response.body.data).toHaveProperty("totalRecipients", 2);
      expect(response.body.data).toHaveProperty("successCount", 1);
      expect(response.body.data).toHaveProperty("failureCount", 1);
      expect(response.body.data).toHaveProperty("isComplete", true);
      expect(response.body.data.recipients).toHaveLength(2);
    });

    it("should return 404 for non-existent history ID", async () => {
      const response = await request(app)
        .get("/api/admin/email/send-progress/507f1f77bcf86cd799439011")
        .set("Cookie", `token-banhmi=${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Email history not found");
    });

    it("should require admin authentication", async () => {
      await request(app)
        .get(`/api/admin/email/send-progress/${testHistoryId}`)
        .expect(401);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to bulk email endpoint", async () => {
      const recipientIds = [testBuyers[0].user._id.toString()];
      const requestData = {
        templateId: testTemplate._id.toString(),
        recipientIds: recipientIds,
      };

      // Make 6 requests quickly (limit is 5 per 15 minutes)
      const requests = Array(6)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/admin/email/send-bulk")
            .set("Cookie", `token-banhmi=${adminToken}`)
            .send(requestData)
        );

      const responses = await Promise.all(requests);

      // First 5 should succeed or at least not be rate limited
      // 6th should be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
