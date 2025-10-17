using Amazon.DynamoDBv2.DataModel;

[DynamoDBTable("Users")]
public class DBUser
{
    [DynamoDBHashKey] // Partition key
    public string email { get; set; }

    public string username { get; set; }
    public string temp_password { get; set; }

   public int busId { get; set; }
    public string first_name { get; set; }
    public string last_name { get; set; }

    public string phone_number { get; set; }




    // Add more attributes as needed
}