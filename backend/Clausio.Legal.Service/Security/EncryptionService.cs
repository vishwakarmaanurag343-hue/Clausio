using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace Clausio.Legal.Service.Security;

public interface IEncryptionService
{
    string Encrypt(string plainText);
    string Decrypt(string cipherText);
}

public class AesEncryptionService : IEncryptionService
{
    private readonly byte[] _key;
    private readonly byte[] _iv;

    public AesEncryptionService(IConfiguration config)
    {
        var keyStr = config["Encryption:Key"];
        var ivStr = config["Encryption:IV"];

        if (string.IsNullOrWhiteSpace(keyStr))
        {
            // Default 256-bit fallback key if not configured in environment
            _key = SHA256.HashData(Encoding.UTF8.GetBytes("Clausio-Default-Master-Encryption-Key-2026-Secure"));
        }
        else
        {
            _key = Convert.FromBase64String(keyStr);
        }

        if (string.IsNullOrWhiteSpace(ivStr))
        {
            // 16 bytes IV fallback
            _iv = MD5.HashData(Encoding.UTF8.GetBytes("Clausio-IV-2026"));
        }
        else
        {
            _iv = Convert.FromBase64String(ivStr);
        }
    }

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = _iv;

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        {
            var bytes = Encoding.UTF8.GetBytes(plainText);
            cs.Write(bytes, 0, bytes.Length);
            cs.FlushFinalBlock();
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        try
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            var cipherBytes = Convert.FromBase64String(cipherText);
            using var ms = new MemoryStream(cipherBytes);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var reader = new StreamReader(cs, Encoding.UTF8);
            return reader.ReadToEnd();
        }
        catch
        {
            // If already decrypted or invalid, return original text safely
            return cipherText;
        }
    }
}
