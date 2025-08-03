package com.xpend.transaction.converter;

import com.xpend.transaction.util.EncryptionUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * JPA AttributeConverter for automatic encryption/decryption of BigDecimal fields (like amounts)
 */
@Converter
@Component
public class EncryptedBigDecimalConverter implements AttributeConverter<BigDecimal, String> {
    
    @Autowired
    private EncryptionUtil encryptionUtil;
    
    @Override
    public String convertToDatabaseColumn(BigDecimal attribute) {
        if (attribute == null) {
            return null;
        }
        return encryptionUtil.encrypt(attribute.toString());
    }
    
    @Override
    public BigDecimal convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        String decryptedValue = encryptionUtil.decrypt(dbData);
        return new BigDecimal(decryptedValue);
    }
}