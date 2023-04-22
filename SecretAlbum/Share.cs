using System.ComponentModel.DataAnnotations;

namespace SecretAlbum
{
    public class Share
    {
        [Key]
        public string Id { get; set; }
        public string Owner { get; set; }
        public string Recipient { get; set; }
        public string EncKey { get; set; }
    }
}