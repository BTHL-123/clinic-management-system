import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbFixer {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/clinic_management";
        String user = "postgres";
        String password = "1";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            int updated = stmt.executeUpdate(
                "UPDATE doctors SET doctor_code = 'DOC-' || doctor_id"
            );
            System.out.println("Normalized " + updated + " doctor codes to DOC-{id}");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
