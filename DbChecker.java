import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbChecker {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/clinic_management";
        String user = "postgres";
        String password = "1";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            ResultSet rs = stmt.executeQuery(
                "SELECT tgname FROM pg_trigger WHERE tgrelid = 'doctor_schedules'::regclass OR tgrelid = 'appointment_slots'::regclass"
            );
            System.out.println("Triggers:");
            while (rs.next()) {
                System.out.println(rs.getString(1));
            }
            rs.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
