using Microsoft.AspNetCore.Mvc;
using SecretAlbum.Services;

namespace SecretAlbum.Controllers
{
    public class UserController : Controller
    {
        private readonly ILogger<UserController> _logger;
        private IUserService _userService;

        public UserController(ILogger<UserController> logger, IUserService userService)
        {
            _logger = logger;
            _userService = userService;
        }

        [HttpGet]
        public IActionResult GetTime()
        {
            return Ok(_userService.GetTimeString(DateTime.Now));
        }

        [HttpGet]
        public IActionResult GetUserId([FromQuery] string userAlias)
        {
            try
            {
                return Ok(_userService.GetUserId(userAlias));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpGet]
        public IActionResult GetAlbums()
        {
            try
            {
                return Ok(_userService.GetAlbums());
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpPost]
        public IActionResult RegisterAlbum([FromQuery] string albumId, [FromForm] string signature, [FromForm] string userAlias)
        {
            try
            {
                _userService.RegisterAlbum(albumId, userAlias, signature);
                return Ok();
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpGet]
        public IActionResult GetImages([FromQuery] string albumId)
        {
            try
            {
                return Ok(_userService.GetUserImages(albumId));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpGet]
        public IActionResult GetShares([FromQuery] string shareTo, [FromQuery] string albumId)
        {
            try
            {
                return Ok(_userService.GetShares(shareTo, albumId));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpGet]
        public IActionResult GetSharesForAlbum([FromQuery] string albumId)
        {
            try
            {
                return Ok(_userService.GetSharesForAlbum(albumId));
            }
            catch
            {
                return Ok("--FAILED--");
            }
        }

        [HttpPost]
        public IActionResult AddImage([FromQuery] string albumId, [FromForm] string signature, [FromForm] string seed, [FromForm] string encryptedImg, [FromForm] string description, [FromForm] string pubKey)
        {
            try
            {
                if (!_userService.VerifyMessage(albumId, signature)) return Ok("Not authorized.");
                string msg = _userService.AddImage(albumId, seed, encryptedImg, description, "0");
                return Ok(msg);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult DeleteImage([FromQuery] string albumId, [FromForm] string imageId, [FromForm] string signature)
        {
            try
            {
                if (!_userService.VerifyMessage(albumId, signature)) return Ok("Not authorized.");
                string msg = _userService.DeleteImage(imageId);
                return Ok(msg);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult MakePublic([FromQuery] string albumId, [FromForm] string signature, [FromForm] string imageId, [FromForm] string pubKey)
        {
            try
            {
                if (!_userService.VerifyMessage(albumId, signature)) return Ok("Not authorized.");
                string msg = _userService.MakePublic(albumId, imageId, pubKey);
                return Ok(msg);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

        [HttpPost]
        public IActionResult ShareTo([FromQuery] string albumId, [FromForm] string signature, [FromForm] string imageId, [FromForm] string shareTo, [FromForm] string encKey)
        {
            try
            {
                if (!_userService.VerifyMessage(albumId, signature)) return Ok("Not authorized.");
                string msg = _userService.ShareTo(albumId, imageId, shareTo, encKey);
                return Ok(msg);
            }
            catch
            {
                return Ok("--FAILED--");
            }

        }

    }
}